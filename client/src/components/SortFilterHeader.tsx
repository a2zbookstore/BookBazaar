import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortFilterHeaderProps {
  currentCount: number;
  totalCount: number;
  startIndex?: number;
  endIndex?: number;
  showResults?: boolean;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
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

  return (
    <div className="flex justify-between items-center ">
      {leftContent ? (
        leftContent
      ) : showResults ? (
        <p className="text-secondary-black">
          Showing {displayStartIndex}-{displayEndIndex} of {totalCount} results
        </p>
      ) : null}

      {rightContent ? (
        rightContent
      ) : sortOptions.length > 0 ? (
        <div className="relative w-36">
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full border border-primary-aqua px-3 py-2 appearance-none rounded-full hover:cursor-pointer text-primary-aqua focus:outline-none focus:ring-2 focus:ring-primary-aqua"
          >
            <option value="" disabled>
              Sort by
            </option>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary-aqua" size={20} />
        </div>
      ) : null}
    </div>
  );
}
