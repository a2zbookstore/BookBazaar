import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortOption {
  value: string;
  label: string;
}

interface SortFilterHeaderProps {
  // Results info
  currentCount: number;
  totalCount: number;
  startIndex?: number;
  endIndex?: number;
  showResults?: boolean;
  
  // Sort functionality
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  
  // Optional custom content
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export default function SortFilterHeader({
  currentCount,
  totalCount,
  startIndex,
  endIndex,
  showResults = true,
  sortValue,
  onSortChange,
  sortOptions,
  leftContent,
  rightContent,
}: SortFilterHeaderProps) {
  const displayStartIndex = startIndex ?? (currentCount > 0 ? 1 : 0);
  const displayEndIndex = endIndex ?? currentCount;
  
  // Ensure sortOptions is an array
  const options = Array.isArray(sortOptions) ? sortOptions : [];
  
  return (
    <div className="flex justify-between items-center mb-6">
      {leftContent ? (
        leftContent
      ) : showResults ? (
        <p className="text-secondary-black">
          Showing {displayStartIndex}-{displayEndIndex} of {totalCount} results
        </p>
      ) : null}
      
      {rightContent ? (
        rightContent
      ) : options.length > 0 ? (
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
