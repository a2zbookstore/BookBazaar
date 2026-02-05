import { useState, useEffect } from 'react';
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
          className="fixed bg-gradient-to-br from-primary-aqua/30 via-white/80 to-gray-100/90 z-40 transition-opacity left-0 right-0 bottom-0 backdrop-blur-sm"
          onClick={onToggleFilters}
          style={{ top: 'var(--header-height, 120px)' }}
        />
      )}

      {/* Floating Filter Panel */}
      <aside
        className={`fixed left-0 w-80 bg-gradient-to-br from-white via-gray-50 to-primary-aqua/10 dark:from-gray-900 dark:via-gray-800 dark:to-primary-aqua/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto border-r border-primary-aqua/30 ${showFilters ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{
          top: 'var(--header-height, 120px)',
          height: 'calc(100vh - var(--header-height, 120px))'
        }}
      >
        <Card className="h-full border-0 rounded-none bg-transparent">
          <CardHeader className="sticky top-0 bg-white/90 dark:bg-gray-900/90 z-10 border-b border-primary-aqua/20 shadow-sm px-3 py-4">
            <CardTitle className="flex items-center justify-between text-primary-aqua dark:text-primary-aqua">
              <span className="flex items-center gap-2 text-lg font-bold tracking-wide">
                <Filter className="h-5 w-5" />
                Filters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleFilters}
                className="hover:bg-gray-300 hover:text-white hover:rounded-full focus:ring-2 focus:ring-primary-aqua"
              >
                <X className="h-5 w-5 hover:text-white" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 pb-6 px-4">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <Label className="text-lg font-semibold mb-2 block text-primary-aqua">Category</Label>
                <div className="space-y-1  pr-2 custom-scrollbar">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2 group hover:bg-primary-aqua/5 rounded-lg px-2 py-1 transition-colors">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={tempSelectedCategories.includes(category.id.toString())}
                        onCheckedChange={(checked) =>
                          handleTempCategoryChange(category.id.toString(), checked as boolean)
                        }
                        className="accent-primary-aqua focus:ring-2 focus:ring-primary-aqua rounded-full"
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer group-hover:text-primary-aqua"
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
              <Label className="text-lg font-semibold mb-2 block text-primary-aqua">
                Price Range
              </Label>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={tempMinPrice}
                  onChange={(e) => setTempMinPrice(e.target.value)}
                  className="flex-1 rounded-xl border border-primary-aqua/30 focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua"
                />

                <Input
                  type="number"
                  placeholder="Max"
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(e.target.value)}
                  className="flex-1 rounded-xl border border-primary-aqua/30 focus:border-primary-aqua focus:ring-2 focus:ring-primary-aqua"
                />
              </div>
            </div>


            {/* Condition */}
            <div>
              <Label className="text-lg font-semibold mb-2 block text-primary-aqua">Condition</Label>
              <div className="space-y-1">
                {conditions.map((condition) => (
                  <div key={condition} className="flex items-center space-x-2 group hover:bg-primary-aqua/5 rounded-lg px-2 py-1 transition-colors">
                    <Checkbox
                      id={`condition-${condition}`}
                      checked={tempSelectedConditions.includes(condition)}
                      onCheckedChange={(checked) =>
                        handleTempConditionChange(condition, checked as boolean)
                      }
                      className="accent-primary-aqua focus:ring-2 focus:ring-primary-aqua rounded-full"
                    />
                    <Label
                      htmlFor={`condition-${condition}`}
                      className="text-sm text-gray-700 dark:text-gray-200 cursor-pointer group-hover:text-primary-aqua"
                    >
                      {condition}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-w-xs flex gap-4 items-center justify-between">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full border-primary-aqua text-primary-aqua hover:bg-red-400 hover:border-none hover:text-white rounded-full transition-all duration-200 shadow-sm"
              >
                Clear Filters
              </Button>

              <Button
                onClick={handleApplyFilters}
                disabled={
                  tempSelectedCategories.length === 0 &&
                  tempSelectedConditions.length === 0 &&
                  !tempMinPrice &&
                  !tempMaxPrice
                }
                className="w-full bg-primary-aqua hover:brightness-110 hover:shadow-lg active:scale-[0.98] text-white rounded-full transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-none disabled:active:scale-100"
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
