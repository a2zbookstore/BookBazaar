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
    <nav className={`mt-6 mb-6 ${className}`} aria-label="Breadcrumb">
      <div className="flex items-center flex-wrap gap-2 text-sm">
        {/* Home Link */}
        <Link 
          href="/" 
          className="text-gray-600 hover:text-primary-aqua transition-all duration-200 font-medium"
        >
          Home
        </Link>
        
        {items.map((item, index) => {
          const isActive = isLastItem(index) && !item.href;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-gray-400" />
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="text-gray-600 hover:text-primary-aqua transition-all duration-200 font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={`${
                    isActive 
                      ? "text-primary-aqua font-bold cursor-default" 
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
