import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface BannerItem {
  id: string | number;
  image: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}

interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlayInterval?: number; // in milliseconds, default 5000 (5 seconds)
  showIndicators?: boolean;
  showNavigation?: boolean;
  height?: string; // Tailwind class like "h-64" or "h-96"
  className?: string;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  autoPlayInterval = 5000,
  showIndicators = true,
  showNavigation = true,
  height = "h-96",
  className = "",
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (banners.length <= 1 || autoPlayInterval <= 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${height} overflow-hidden rounded-lg ${className}`}>
      {/* Banner slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="min-w-full h-full flex-shrink-0 relative"
          >
            {banner.link ? (
              <Link href={banner.link}>
                <a className="block h-full w-full cursor-pointer">
                  <img
                    src={banner.image}
                    alt={banner.alt || banner.title || "Banner"}
                    className="w-full h-full object-cover max-h-48 md:max-h-64 lg:max-h-80 xl:max-h-96"
                  />
                  {(banner.title || banner.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-8">
                      {banner.title && (
                        <h2 className="text-white text-3xl md:text-5xl font-bold mb-2">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle && (
                        <p className="text-white/90 text-lg md:text-xl mb-4">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.buttonText && (
                        <button className="bg-primary-aqua hover:bg-secondary-aqua text-white px-6 py-3 rounded-lg font-semibold w-fit transition-colors">
                          {banner.buttonText}
                        </button>
                      )}
                    </div>
                  )}
                </a>
              </Link>
            ) : (
              <>
                <img
                  src={banner.image}
                  alt={banner.alt || banner.title || "Banner"}
                  className="w-full h-full object-cover max-h-48 md:max-h-64 lg:max-h-80 xl:max-h-96"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-8">
                    {banner.title && (
                      <h2 className="text-white text-3xl md:text-5xl font-bold mb-2">
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p className="text-white/90 text-lg md:text-xl mb-4">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.buttonText && (
                      <button className="bg-primary-aqua hover:bg-secondary-aqua text-white px-6 py-3 rounded-lg font-semibold w-fit transition-colors">
                        {banner.buttonText}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showNavigation && banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-primary-aqua/20 hover:border-primary-aqua/50 group"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-8 w-8 text-primary-aqua mx-auto group-hover:text-secondary-aqua transition-colors" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-primary-aqua/20 hover:border-primary-aqua/50 group"
            aria-label="Next banner"
          >
            <ChevronRight className="h-8 w-8 text-primary-aqua mx-auto group-hover:text-secondary-aqua transition-colors" />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {showIndicators && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
