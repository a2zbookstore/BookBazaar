import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Category } from '@/types';

interface FiltersSidebarProps {
  // Visibility
  showFilters: boolean;
  onToggleFilters: () => void;
  
  // Categories
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string, checked: boolean) => void;
  
  // Price Range
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  
  // Condition
  conditions: string[];
  selectedConditions: string[];
  onConditionChange: (condition: string, checked: boolean) => void;
  
  // Clear Filters
  onClearFilters: () => void;
  
  // Apply Filters
  onApplyFilters: () => void;
}

export default function FiltersSidebar({
  showFilters,
  onToggleFilters,
  categories,
  selectedCategories,
  onCategoryChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  conditions,
  selectedConditions,
  onConditionChange,
  onClearFilters,
  onApplyFilters,
}: FiltersSidebarProps) {
  // Local state for temporary filter values
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>(selectedCategories);
  const [tempSelectedConditions, setTempSelectedConditions] = useState<string[]>(selectedConditions);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);

  // Sync with parent state when filters change externally
  useEffect(() => {
    setTempSelectedCategories(selectedCategories);
    setTempSelectedConditions(selectedConditions);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
  }, [selectedCategories, selectedConditions, minPrice, maxPrice]);

  const handleTempCategoryChange = (categoryId: string, checked: boolean) => {
    setTempSelectedCategories(prev => 
      checked 
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
  };

  const handleTempConditionChange = (condition: string, checked: boolean) => {
    setTempSelectedConditions(prev => 
      checked 
        ? [...prev, condition]
        : prev.filter(c => c !== condition)
    );
  };

  const handleApplyFilters = () => {
    // Apply all temporary filters to parent state
    tempSelectedCategories.forEach((catId, index) => {
      if (index === 0 || !selectedCategories.includes(catId)) {
        onCategoryChange(catId, true);
      }
    });
    selectedCategories.forEach(catId => {
      if (!tempSelectedCategories.includes(catId)) {
        onCategoryChange(catId, false);
      }
    });

    tempSelectedConditions.forEach((cond, index) => {
      if (index === 0 || !selectedConditions.includes(cond)) {
        onConditionChange(cond, true);
      }
    });
    selectedConditions.forEach(cond => {
      if (!tempSelectedConditions.includes(cond)) {
        onConditionChange(cond, false);
      }
    });

    onMinPriceChange(tempMinPrice);
    onMaxPriceChange(tempMaxPrice);
    
    onApplyFilters();
    onToggleFilters();
  };

  const handleClearFilters = () => {
    setTempSelectedCategories([]);
    setTempSelectedConditions([]);
    setTempMinPrice('');
    setTempMaxPrice('');
    onClearFilters();
  };

  return (
    <>
      {/* Backdrop */}
      {showFilters && (
        <div 
          className="fixed bg-black/50 z-40 transition-opacity left-0 right-0 bottom-0"
          onClick={onToggleFilters}
          style={{ top: 'var(--header-height, 120px)' }}
        />
      )}
      
      {/* Floating Filter Panel */}
      <aside 
        className={`fixed left-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          showFilters ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ 
          top: 'var(--header-height, 120px)',
          height: 'calc(100vh - var(--header-height, 120px))'
        }}
      >
        <Card className="h-full border-0 rounded-none">
          <CardHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFilters}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Category</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={tempSelectedCategories.includes(category.id.toString())}
                        onCheckedChange={(checked) => 
                          handleTempCategoryChange(category.id.toString(), checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`category-${category.id}`}
                        className="text-sm text-secondary-black cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Price Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={tempMinPrice}
                  onChange={(e) => setTempMinPrice(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Condition */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Condition</Label>
              <div className="space-y-2">
                {conditions.map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={tempSelectedConditions.includes(condition)}
                      onCheckedChange={(checked) => 
                        handleTempConditionChange(condition, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`condition-${condition}`}
                      className="text-sm text-secondary-black cursor-pointer"
                    >
                      {condition}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="w-full border-primary-aqua text-primary-aqua hover:bg-primary-aqua hover:text-white"
              >
                Clear Filters
              </Button>
              
              <Button 
                onClick={handleApplyFilters}
                className="w-full bg-primary-aqua hover:bg-secondary-aqua"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </>
  );
}
