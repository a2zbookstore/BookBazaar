import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const isLastItem = (index: number) => index === items.length - 1;

  return (
    <nav className={`mt-4 sm:mt-6 mb-4 sm:mb-6 ${className}`} aria-label="Breadcrumb">
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm sm:text-sm min-w-0">
        {/* Home */}
        <Link
          href="/"
          className="max-w-[120px] sm:max-w-none truncate text-gray-600 hover:text-primary-aqua transition-colors font-medium"
        >
          Home
        </Link>

        {items.map((item, index) => {
          const isActive = isLastItem(index) && !item.href;

          return (
            <div key={index} className="flex items-center gap-1 sm:gap-2 min-w-0">
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />

              {item.href ? (
                <Link
                  href={item.href}
                  className="max-w-[140px] sm:max-w-[240px] truncate text-gray-600 hover:text-primary-aqua transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px] lg:max-w-[420px] ${
                    isActive
                      ? "text-primary-aqua font-semibold cursor-default"
                      : "text-gray-800 font-medium"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
