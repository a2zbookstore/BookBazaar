import React, { useState, useEffect, useRef } from "react";
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
  pageName: string;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showNavigation?: boolean;
  height?: string; // Defaulting to responsive classes
  className?: string;
}


const BannerCarousel: React.FC<BannerCarouselProps> = ({
  pageName,
  autoPlayInterval = 5000,
  showIndicators = true, 
  showNavigation = true,
  height = "h-56 sm:h-72 md:h-96",
  className = "",
}) => {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Fetch banners from API
  useEffect(() => {
    fetch(`/api/bannersbyName?page_type=${encodeURIComponent(pageName)}`)
      .then(res => res.json())
      .then((data) => {
        // Map API response to BannerItem[]
        if (Array.isArray(data) && data.length > 0) {
          const items: BannerItem[] = data[0].image_urls.map((img: string, idx: number) => ({
            id: `${data[0].id}_${idx}`,
            image: img,
            alt: data[0].page_type,
          }));
          setBanners(items);
        } else {
          setBanners([]);
        }
      })
      .catch(() => setBanners([]));
  }, [pageName]);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  // Touch handlers for mobile swiping
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  if (banners.length === 0) return null;

  return (
    <div 
      className={`relative ${height} overflow-hidden rounded-lg shadow-md ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Banner slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full h-full flex-shrink-0 relative">
            <div className="h-full w-full">
              <img
                src={banner.image}
                alt={banner.alt || banner.title || "Banner"}
                className="w-full h-full object-cover"
              />
              
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-8">
                  <div className="max-w-[85%] md:max-w-2xl">
                    {banner.title && (
                      <h2 className="text-white text-xl md:text-5xl font-bold mb-1 md:mb-2 line-clamp-2">
                        {banner.title}
                      </h2>
                    )}
                    {banner.subtitle && (
                      <p className="text-white/90 text-sm md:text-xl mb-3 md:mb-4 line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.buttonText && (
                      <Link href={banner.link || "#"}>
                        <button className="bg-primary-aqua hover:bg-secondary-aqua text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold w-fit transition-colors">
                          {banner.buttonText}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows - Hidden/Smaller on mobile */}
      {showNavigation && banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/80 md:bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 md:h-8 md:w-8 text-primary-aqua" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/80 md:bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-all"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 md:h-8 md:w-8 text-primary-aqua" />
          </button>
        </>
      )}

      {/* Indicator dots - Scaled for mobile */}
      {showIndicators && banners.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 md:h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-4 md:w-8" : "bg-white/50 w-1.5 md:w-2"
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