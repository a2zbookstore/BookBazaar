import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, RefreshCw, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GiftItem, GiftCategory } from '@/shared/schema';

interface GiftWithPurchaseProps {
  hasItemsInCart: boolean;
  onGiftAdded?: () => void;
}

export default function GiftWithPurchase({ hasItemsInCart, onGiftAdded }: GiftWithPurchaseProps) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch gift categories from database (public endpoint)
  const { data: giftCategories = [], isLoading: categoriesLoading } = useQuery<GiftCategory[]>({
    queryKey: ["/api/gift-categories"],
    refetchInterval: 1000, // Refetch every 1 second
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch gift items from database (public endpoint)
  const { data: giftItems = [], isLoading: itemsLoading } = useQuery<GiftItem[]>({
    queryKey: ["/api/gift-items"],
    refetchInterval: 1000, // Refetch every 1 second
    staleTime: 0,
    gcTime: 0,
  });

  const isLoading = categoriesLoading || itemsLoading;

  // Filter active categories and sort by sortOrder
  const activeCategories = giftCategories
    .filter(category => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Filter active items and sort by sortOrder
  const activeGiftItems = giftItems
    .filter(item => item.isActive && (!selectedCategory || item.categoryId === selectedCategory))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    // Load selected gift from localStorage
    const savedGift = localStorage.getItem('selectedGift');
    if (savedGift) {
      setSelectedGift(savedGift);
    }
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Gift Categories Data:', giftCategories);
    console.log('Gift Items Data:', giftItems);
  }, [giftCategories, giftItems]);

  useEffect(() => {
    setIsVisible(hasItemsInCart);
  }, [hasItemsInCart]);

  // Auto-advance carousel
  useEffect(() => {
    if (activeCategories.length > 3 && !isPaused) {
      const interval = setInterval(() => {
        setCarouselIndex(prev => 
          prev < activeCategories.length - 1 ? prev + 1 : 0
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeCategories.length, isPaused]);

  const handleGiftSelect = async (giftId: string) => {
    if (selectedGift === giftId) return; // Already selected
    
    // Find the gift item
    const giftItem = activeGiftItems.find(item => item.id.toString() === giftId);
    if (!giftItem) return;

    try {
      // Add gift to cart via API
      const response = await fetch('/api/cart/gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          giftId: giftItem.id,
          name: giftItem.name,
          type: giftItem.type,
          imageUrl: giftItem.imageUrl,
          price: 0, // Always free
          quantity: 1
        }),
      });

      if (response.ok) {
        setSelectedGift(giftId);
        localStorage.setItem('selectedGift', giftId);
        
        // Show confirmation alert
        alert(`🎁 Great choice! "${giftItem.name}" has been added to your cart as a free gift!`);
        
        // Notify parent component to refresh cart
        if (onGiftAdded) {
          onGiftAdded();
        }
      } else {
        const error = await response.json();
        alert(`Error adding gift: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding gift to cart:', error);
      alert('Failed to add gift to cart. Please try again.');
    }
  };

  const handleRefreshGifts = async () => {
    try {
      // Remove gift from cart via API
      await fetch('/api/cart/gift', {
        method: 'DELETE',
        credentials: 'include',
      });
      
      setSelectedGift(null);
      localStorage.removeItem('selectedGift');
      
      // Notify parent component to refresh cart
      if (onGiftAdded) {
        onGiftAdded();
      }
    } catch (error) {
      console.error('Error removing gift from cart:', error);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Always show the gift section
  const alwaysVisible = true;

  if (isLoading) {
    return (
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Loading special gift offers...</p>
        </div>
      </motion.section>
    );
  }

  // Always show the section even if no gift items are available
  // This allows users to see the gift categories and know the feature exists

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-green-200 to-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center gap-3 mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Gift className="h-12 w-12 text-green-500" />
              </motion.div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎁 SPECIAL GIFT OFFER! 🎁
              </h2>
            </motion.div>
            
            <motion.p 
              className="text-2xl text-gray-700 dark:text-gray-300 mb-6 font-semibold"
              variants={itemVariants}
            >
              Buy any book and get <span className="font-bold text-green-600 text-3xl">1 FREE Gift</span> of your choice!
            </motion.p>
            
            {!isVisible && alwaysVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300 rounded-xl p-4 mb-6 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="text-2xl"
                  >
                    🛒
                  </motion.div>
                  <p className="text-orange-800 font-medium">
                    Add any book to your cart to activate this special gift offer!
                  </p>
                </div>
              </motion.div>
            )}
            
            {selectedGift && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400"
              >
                <Check className="h-5 w-5" />
                <span className="font-medium">Gift selected! It will be added to your cart.</span>
              </motion.div>
            )}
          </motion.div>

          {/* Category Horizontal Moving Carousel */}
          <motion.div 
            variants={itemVariants}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="text-center flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Gift Category</h3>
                <p className="text-gray-600">Select a category to see available gifts</p>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  // Navigate to gift categories page or show all gifts
                  window.open('/catalog?gift=true', '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                See All
              </Button>
            </div>
            
            <div className="relative overflow-hidden">
              {/* Navigation Arrows */}
              {activeCategories.length > 3 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 p-0"
                    onClick={() => {
                      setCarouselIndex(prev => 
                        prev > 0 ? prev - 1 : activeCategories.length - 1
                      );
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full w-10 h-10 p-0"
                    onClick={() => {
                      setCarouselIndex(prev => 
                        prev < activeCategories.length - 1 ? prev + 1 : 0
                      );
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <motion.div 
                className="flex gap-6 py-4"
                animate={{ 
                  x: activeCategories.length > 3 && !isPaused ? 
                    [carouselIndex * -220, (carouselIndex + 1) * -220] : 
                    activeCategories.length <= 3 ? [0, 0, 0] : [carouselIndex * -220, carouselIndex * -220]
                }}
                transition={{ 
                  duration: activeCategories.length > 3 && !isPaused ? 15 : 0, 
                  repeat: activeCategories.length > 3 && !isPaused ? Infinity : 0, 
                  ease: "linear" 
                }}
                style={{ 
                  width: activeCategories.length > 3 ? `${activeCategories.length * 220 + 400}px` : 'auto',
                  justifyContent: activeCategories.length <= 3 ? 'center' : 'flex-start'
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Show categories with duplication for seamless scroll if needed */}
                {(activeCategories.length > 3 ? [...activeCategories, ...activeCategories] : activeCategories).map((category, index) => (
                  <motion.div
                    key={`${category.id}-${index}`}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      flex-shrink-0 cursor-pointer transition-all duration-300 group
                      ${selectedCategory === category.id ? 'transform scale-110' : 'hover:scale-105'}
                    `}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`
                      w-52 h-40 rounded-xl overflow-hidden shadow-lg border-4 transition-all duration-300 bg-white
                      ${selectedCategory === category.id 
                        ? 'border-green-500 shadow-green-200 ring-2 ring-green-300' 
                        : 'border-gray-200 group-hover:border-blue-300 group-hover:shadow-blue-200'
                      }
                    `}>
                      {/* Category Image */}
                      <div className="relative h-28 overflow-hidden">
                        {category.imageUrl ? (
                          <img 
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <span className="text-4xl">
                              {category.type === 'novel' ? '📖' : '📝'}
                            </span>
                          </div>
                        )}
                        
                        {/* Price Badge - Top Left */}
                        {category.price && Number(category.price) > 0 && (
                          <div className="absolute top-2 left-2">
                            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                              ${Number(category.price).toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        {selectedCategory === category.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 bg-green-500 rounded-full p-2 shadow-lg"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Category Info */}
                      <div className="p-3">
                        <h4 className="font-bold text-gray-800 text-center truncate">
                          {category.name}
                        </h4>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          {category.price && Number(category.price) > 0 && (
                            <span className="text-sm font-semibold text-green-600">
                              ${Number(category.price).toFixed(2)}
                            </span>
                          )}
                          <Badge 
                            variant={category.type === 'novel' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {category.type === 'novel' ? '📖 Novel' : '📝 Notebook'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1 truncate">
                          {category.description || (category.type === 'novel' ? 'Novel Collection' : 'Notebook Collection')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Gift Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeGiftItems.map((gift, index) => {
              const isSelected = selectedGift === gift.id.toString();
              return (
                <motion.div
                  key={gift.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Card 
                    className={`
                      relative overflow-hidden transition-all duration-300 cursor-pointer group h-full
                      ${isSelected 
                        ? 'ring-4 ring-green-500 shadow-2xl bg-gradient-to-br from-green-50 to-blue-50 border-green-300' 
                        : 'hover:shadow-xl border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleGiftSelect(gift.id.toString())}
                  >
                    <CardContent className="p-6">
                      {/* Gift Image */}
                      <div className="relative mb-4 overflow-hidden rounded-xl bg-gray-100">
                        <img 
                          src={gift.imageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=300&fit=crop'} 
                          alt={gift.name}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=300&fit=crop';
                          }}
                        />
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2 shadow-lg"
                          >
                            <Check className="h-5 w-5" />
                          </motion.div>
                        )}
                      </div>

                      {/* Gift Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={gift.type === 'novel' ? 'default' : 'secondary'}
                            className="text-xs font-medium"
                          >
                            {gift.type === 'novel' ? '📖 Novel' : '📝 Notebook'}
                          </Badge>
                          {gift.price && parseFloat(gift.price) > 0 && (
                            <Badge variant="outline" className="text-xs">
                              ${parseFloat(gift.price).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                          {gift.name}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {gift.description || 'Special gift item'}
                        </p>

                        {gift.isbn && (
                          <p className="text-xs text-gray-500">
                            ISBN: {gift.isbn}
                          </p>
                        )}

                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-3 rounded-lg text-sm font-medium"
                          >
                            ✅ Selected as your free gift!
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <motion.div 
            className="text-center mt-12"
            variants={itemVariants}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleRefreshGifts}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 text-lg font-medium border-2 border-gray-300 hover:border-blue-400"
                >
                  <RefreshCw className="h-5 w-5" />
                  Reset Selection
                </Button>
              </motion.div>
              
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-400 max-w-md"
                variants={itemVariants}
              >
                * Free gift will be automatically added to your cart when you proceed to checkout with any book purchase.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}