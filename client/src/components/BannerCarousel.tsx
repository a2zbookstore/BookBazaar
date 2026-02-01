import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";


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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: false,
      containScroll: "trimSnaps",
    },
    autoPlayInterval > 0 ? [Autoplay({ delay: autoPlayInterval })] : []
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Fetch banners from API
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/bannersbyName?page_type=${encodeURIComponent(pageName)}`)
      .then(res => res.json())
      .then((data) => {
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
        setIsLoading(false);
      })
      .catch(() => {
        setBanners([]);
        setIsLoading(false);
      });
  }, [pageName]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (isLoading) {
    return (
      <div className={`relative ${height} overflow-hidden rounded-lg shadow-md ${className}`}>
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-lg">Loading...</div>
        </div>
      </div>
    );
  }
  if (banners.length === 0) return null;

  return (
    <div className={`relative ${height} overflow-hidden rounded-lg shadow-md ${className}`}>
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {banners.map((banner, index) => (
            <div key={banner.id} className="embla__slide flex-[0_0_100%] relative h-full">
              <div className="h-full w-full relative">
                <img
                  src={banner.image}
                  alt={banner.alt || banner.title || "Banner"}
                  className="w-full h-full object-cover object-center block"
                  style={{ minHeight: '100%' }}
                  loading={index === 0 ? "eager" : "lazy"}
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
      </div>

      {/* Navigation arrows - Hidden/Smaller on mobile */}
      {showNavigation && banners.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/80 md:bg-white shadow-lg flex items-center justify-center hover:scale-110 transition-all"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 md:h-8 md:w-8 text-primary-aqua" />
          </button>
          <button
            onClick={scrollNext}
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
              onClick={() => scrollTo(index)}
              className={`h-1.5 md:h-2 rounded-full transition-all ${
                index === selectedIndex ? "bg-white w-4 md:w-8" : "bg-white/50 w-1.5 md:w-2"
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