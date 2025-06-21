import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GiftItem {
  id: string;
  name: string;
  type: 'novel' | 'notebook';
  image: string;
  description: string;
}

interface GiftWithPurchaseProps {
  hasItemsInCart: boolean;
}

const GIFT_ITEMS: GiftItem[] = [
  {
    id: 'novel-1',
    name: 'Classic Mystery Novel',
    type: 'novel',
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&h=300&fit=crop',
    description: 'A thrilling mystery novel by renowned authors'
  },
  {
    id: 'novel-2',
    name: 'Romance Collection',
    type: 'novel',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop',
    description: 'Beautiful collection of romantic short stories'
  },
  {
    id: 'novel-3',
    name: 'Adventure Chronicles',
    type: 'novel',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=300&fit=crop',
    description: 'Epic adventure tales for young readers'
  },
  {
    id: 'notebook-1',
    name: 'Premium Leather Notebook',
    type: 'notebook',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=300&fit=crop',
    description: 'High-quality leather-bound writing journal'
  },
  {
    id: 'notebook-2',
    name: 'Artistic Sketch Pad',
    type: 'notebook',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=300&fit=crop',
    description: 'Perfect for sketching and creative writing'
  },
  {
    id: 'notebook-3',
    name: 'Business Planner',
    type: 'notebook',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=200&h=300&fit=crop',
    description: 'Professional planner for productivity'
  }
];

export default function GiftWithPurchase({ hasItemsInCart }: GiftWithPurchaseProps) {
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load selected gift from localStorage
    const savedGift = localStorage.getItem('selectedGift');
    if (savedGift) {
      setSelectedGift(savedGift);
    }
  }, []);

  useEffect(() => {
    console.log("Gift with Purchase visibility check:", hasItemsInCart);
    setIsVisible(hasItemsInCart);
  }, [hasItemsInCart]);

  const handleGiftSelect = (giftId: string) => {
    if (selectedGift === giftId) return; // Already selected
    
    setSelectedGift(giftId);
    localStorage.setItem('selectedGift', giftId);
    
    // Add gift to cart with special flag
    const giftItem = GIFT_ITEMS.find(item => item.id === giftId);
    if (giftItem) {
      localStorage.setItem('giftDetails', JSON.stringify({
        id: giftItem.id,
        name: giftItem.name,
        type: giftItem.type,
        image: giftItem.image,
        price: 0,
        quantity: 1,
        isGift: true
      }));
    }
  };

  const handleChangeGift = () => {
    setSelectedGift(null);
    localStorage.removeItem('selectedGift');
    localStorage.removeItem('giftDetails');
  };

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -50,
      scale: 0.9,
      transition: {
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateY: -15
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const glowVariants = {
    initial: { 
      boxShadow: "0 0 0px rgba(59, 130, 246, 0)" 
    },
    hover: { 
      boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
      transition: {
        duration: 0.3
      }
    },
    selected: {
      boxShadow: "0 0 25px rgba(34, 197, 94, 0.6)",
      transition: {
        duration: 0.3
      }
    }
  };

  console.log("GiftWithPurchase render - isVisible:", isVisible, "hasItemsInCart:", hasItemsInCart);
  
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
      >
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
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Special Gift Offer!
              </h2>
            </motion.div>
            
            <motion.p 
              className="text-xl text-gray-700 dark:text-gray-300 mb-4"
              variants={itemVariants}
            >
              Buy any book and get <span className="font-bold text-green-600">1 free Novel or Notebook</span> as a gift!
            </motion.p>
            
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

          {/* Gift Selection Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
          >
            {GIFT_ITEMS.map((gift) => (
              <motion.div
                key={gift.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="relative"
              >
                <motion.div
                  variants={glowVariants}
                  initial="initial"
                  whileHover={selectedGift !== gift.id ? "hover" : "selected"}
                  animate={selectedGift === gift.id ? "selected" : "initial"}
                  className="rounded-xl overflow-hidden"
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-300 border-2 ${
                      selectedGift === gift.id 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 hover:border-blue-400 dark:border-gray-700'
                    } ${
                      selectedGift && selectedGift !== gift.id 
                        ? 'opacity-60' 
                        : 'opacity-100'
                    }`}
                    onClick={() => handleGiftSelect(gift.id)}
                  >
                    <CardContent className="p-4">
                      <div className="relative mb-4">
                        <img 
                          src={gift.image} 
                          alt={gift.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        
                        {/* Gift Type Badge */}
                        <Badge 
                          className={`absolute top-2 left-2 ${
                            gift.type === 'novel' 
                              ? 'bg-purple-500 hover:bg-purple-600' 
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {gift.type === 'novel' ? '📚 Novel' : '📓 Notebook'}
                        </Badge>

                        {/* Selection Indicator */}
                        <AnimatePresence>
                          {selectedGift === gift.id && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute top-2 right-2 bg-green-500 rounded-full p-2"
                            >
                              <Check className="h-4 w-4 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                        {gift.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {gift.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">FREE</span>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant={selectedGift === gift.id ? "default" : "outline"}
                            size="sm"
                            className={selectedGift === gift.id ? "bg-green-500 hover:bg-green-600" : ""}
                            disabled={selectedGift === gift.id}
                          >
                            {selectedGift === gift.id ? 'Selected' : 'Select Gift'}
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Change Gift Button */}
          <AnimatePresence>
            {selectedGift && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleChangeGift}
                    className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Change Gift Selection
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}